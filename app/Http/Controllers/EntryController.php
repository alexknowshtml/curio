<?php

namespace App\Http\Controllers;

use App\Models\Entry;
use App\Services\TagParserService;
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
            ->with(['tags', 'images'])
            ->orderBy('created_at', 'desc');

        // Filter by tag if provided
        if ($request->has('tag')) {
            $tagId = $request->input('tag');
            $query->whereHas('tags', function ($q) use ($tagId) {
                $q->where('tags.id', $tagId);
            });
        }

        $entries = $query->limit(100)->get();

        // Get all tags for the filter sidebar
        $allTags = \App\Models\Tag::whereHas('entries', function ($q) {
            $q->where('user_id', Auth::id());
        })->orderBy('sigil')->orderBy('name')->get();

        return Inertia::render('Stream', [
            'entries' => $entries,
            'allTags' => $allTags,
            'activeTagId' => $request->input('tag'),
        ]);
    }

    /**
     * Store a new entry
     */
    public function store(Request $request, TagParserService $tagParser)
    {
        $validated = $request->validate([
            'content' => 'required|string|max:10000',
        ]);

        $entry = Entry::create([
            'user_id' => Auth::id(),
            'content' => $validated['content'],
        ]);

        // Parse and sync tags from content
        $tagParser->syncTagsForEntry($entry);

        // Attach any pending images
        if ($request->has('image_ids') && is_array($request->image_ids)) {
            \App\Models\Image::whereIn('id', $request->image_ids)
                ->whereNull('entry_id')
                ->update(['entry_id' => $entry->id]);

            if (count($request->image_ids) > 0) {
                $entry->update(['has_images' => true]);
            }
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'entry' => $entry->load(['tags', 'images']),
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
}
