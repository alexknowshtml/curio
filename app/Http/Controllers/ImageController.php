<?php

namespace App\Http\Controllers;

use App\Models\Entry;
use App\Models\Image;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageController extends Controller
{
    /**
     * Upload an image (can be for a new entry or attached to existing)
     */
    public function store(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,gif,webp|max:10240', // 10MB max
            'entry_id' => 'nullable|exists:entries,id',
        ]);

        $file = $request->file('image');
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('images/' . date('Y/m'), $filename, 'public');

        // If an entry_id is provided, verify ownership and attach
        $entryId = null;
        if ($request->has('entry_id')) {
            $entry = Entry::where('id', $request->entry_id)
                ->where('user_id', Auth::id())
                ->first();

            if ($entry) {
                $entryId = $entry->id;
                $entry->update(['has_images' => true]);
            }
        }

        $image = Image::create([
            'entry_id' => $entryId,
            'filename' => $file->getClientOriginalName(),
            'path' => $path,
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
        ]);

        return response()->json([
            'success' => true,
            'image' => [
                'id' => $image->id,
                'url' => Storage::url($path),
                'filename' => $image->filename,
            ],
        ]);
    }

    /**
     * Attach an uploaded image to an entry
     */
    public function attachToEntry(Request $request, Image $image)
    {
        $request->validate([
            'entry_id' => 'required|exists:entries,id',
        ]);

        // Image must not already be attached to a different entry
        if ($image->entry_id !== null) {
            return response()->json(['error' => 'Image already attached'], 400);
        }

        $entry = Entry::where('id', $request->entry_id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $image->update(['entry_id' => $entry->id]);
        $entry->update(['has_images' => true]);

        return response()->json(['success' => true]);
    }

    /**
     * Delete an image
     */
    public function destroy(Image $image)
    {
        // Only allow deletion if the image belongs to an entry owned by the user
        // or if the image is unattached (uploaded but not yet saved with entry)
        if ($image->entry_id !== null) {
            $entry = Entry::where('id', $image->entry_id)
                ->where('user_id', Auth::id())
                ->first();

            if (!$entry) {
                abort(403);
            }
        }

        // Delete the file from storage
        Storage::disk('public')->delete($image->path);

        // Delete the database record
        $image->delete();

        return response()->json(['success' => true]);
    }
}
