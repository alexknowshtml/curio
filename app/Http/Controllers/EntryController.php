<?php

namespace App\Http\Controllers;

use App\Models\Draft;
use App\Models\Entry;
use App\Services\TagParserService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class EntryController extends Controller
{
    /**
     * Display the entry stream
     */
    public function index(Request $request)
    {
        $query = Entry::where('user_id', Auth::id())
            ->with(['tags', 'attachments'])
            ->orderBy('created_at', 'desc');

        // Filter by tag if provided
        if ($request->has('tag')) {
            $tagId = $request->input('tag');
            $query->whereHas('tags', function ($q) use ($tagId) {
                $q->where('tags.id', $tagId);
            });
        }

        // Filter by date if provided (date comes in as America/New_York date string)
        $selectedDate = null;
        if ($request->has('date')) {
            $selectedDate = $request->input('date');
            // Parse as America/New_York date and convert to UTC range
            $startOfDay = Carbon::parse($selectedDate, 'America/New_York')->startOfDay()->utc();
            $endOfDay = Carbon::parse($selectedDate, 'America/New_York')->endOfDay()->utc();
            $query->whereBetween('created_at', [$startOfDay, $endOfDay]);
        }

        $entries = $query->limit(100)->get();

        // Get all tags for the filter sidebar
        $allTags = \App\Models\Tag::whereHas('entries', function ($q) {
            $q->where('user_id', Auth::id());
        })->orderBy('sigil')->orderBy('name')->get();

        // Get dates that have entries (for the date picker)
        // Convert UTC timestamps to America/New_York for date grouping
        $datesWithEntries = Entry::where('user_id', Auth::id())
            ->get()
            ->map(fn($e) => $e->created_at->setTimezone('America/New_York')->format('Y-m-d'))
            ->unique()
            ->sortDesc()
            ->values()
            ->toArray();

        return Inertia::render('Stream', [
            'entries' => $entries,
            'allTags' => $allTags,
            'activeTagId' => $request->input('tag'),
            'selectedDate' => $selectedDate,
            'datesWithEntries' => $datesWithEntries,
            'highlightEntryId' => $request->has('highlight') ? (int) $request->input('highlight') : null,
        ]);
    }

    /**
     * Store a new entry
     */
    public function store(Request $request, TagParserService $tagParser)
    {
        $validated = $request->validate([
            'content' => 'nullable|string|max:10000',
            'attachment_ids' => 'nullable|array',
        ]);

        // Must have either content or attachments
        $hasAttachments = !empty($request->input('attachment_ids', $request->input('image_ids', [])));
        if (empty($validated['content']) && !$hasAttachments) {
            return back()->withErrors(['content' => 'Entry must have content or attachments.']);
        }

        $entry = Entry::create([
            'user_id' => Auth::id(),
            'content' => $validated['content'] ?? '',
        ]);

        // Parse and sync tags from content
        $tagParser->syncTagsForEntry($entry);

        // Attach any pending attachments (supports both old image_ids and new attachment_ids)
        $attachmentIds = $request->input('attachment_ids', $request->input('image_ids', []));
        if (is_array($attachmentIds) && count($attachmentIds) > 0) {
            \App\Models\Attachment::whereIn('id', $attachmentIds)
                ->whereNull('entry_id')
                ->update(['entry_id' => $entry->id]);

            $entry->update(['has_images' => true]); // TODO: rename to has_attachments
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'entry' => $entry->load(['tags', 'attachments']),
            ]);
        }

        return back();
    }

    /**
     * Delete an entry
     */
    public function destroy(Entry $entry)
    {
        // Ensure user owns this entry
        if ($entry->user_id !== Auth::id()) {
            abort(403);
        }

        $entry->delete();

        return back();
    }

    /**
     * Search tags for autocomplete
     */
    public function searchTags(Request $request)
    {
        $query = $request->input('q', '');
        $sigil = $request->input('sigil', '');

        $tagsQuery = \App\Models\Tag::whereHas('entries', function ($q) {
            $q->where('user_id', Auth::id());
        });

        if ($sigil) {
            $tagsQuery->where('sigil', $sigil);
        }

        if ($query) {
            $tagsQuery->where('name', 'like', '%' . $query . '%');
        }

        $tags = $tagsQuery->orderBy('name')->limit(10)->get();

        return response()->json($tags);
    }

    /**
     * Search entries by content
     */
    public function search(Request $request)
    {
        $query = $request->input('q', '');
        $recent = $request->boolean('recent', false);

        // If requesting recent entries for cache (no search query)
        if ($recent && strlen($query) < 2) {
            $sevenDaysAgo = Carbon::now()->subDays(7);
            $entries = Entry::where('user_id', Auth::id())
                ->where('created_at', '>=', $sevenDaysAgo)
                ->with(['tags', 'attachments'])
                ->orderBy('created_at', 'desc')
                ->limit(100)
                ->get();

            return response()->json($entries);
        }

        if (strlen($query) < 2) {
            return response()->json([]);
        }

        $entries = Entry::where('user_id', Auth::id())
            ->where('content', 'like', '%' . $query . '%')
            ->with(['tags', 'attachments'])
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        return response()->json($entries);
    }

    /**
     * Get the user's current draft
     */
    public function getDraft()
    {
        $draft = Draft::where('user_id', Auth::id())->first();

        return response()->json([
            'content' => $draft?->content ?? '',
        ]);
    }

    /**
     * Save the user's draft (auto-save)
     */
    public function saveDraft(Request $request)
    {
        $validated = $request->validate([
            'content' => 'nullable|string|max:10000',
        ]);

        Draft::updateOrCreate(
            ['user_id' => Auth::id()],
            ['content' => $validated['content'] ?? '']
        );

        return response()->json(['success' => true]);
    }
}
