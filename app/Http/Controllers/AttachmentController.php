<?php

namespace App\Http\Controllers;

use App\Models\Attachment;
use App\Models\Entry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AttachmentController extends Controller
{
    /**
     * Allowed mime types organized by category
     */
    private const ALLOWED_MIMES = [
        // Images
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        // Documents
        'application/pdf',
        // Text/Code
        'text/plain',
        'text/markdown',
        'text/x-markdown',
        'text/csv',
        'application/json',
        'text/html',
        'text/css',
        'text/javascript',
        'application/javascript',
    ];

    /**
     * Allowed file extensions
     */
    private const ALLOWED_EXTENSIONS = [
        // Images
        'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
        // Documents
        'pdf',
        // Text/Code
        'txt', 'md', 'markdown', 'csv', 'json', 'html', 'htm', 'css', 'js', 'ts', 'py', 'sh', 'bash',
    ];

    /**
     * Upload a file attachment
     */
    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:10240', // 10MB max
            'entry_id' => 'nullable|exists:entries,id',
        ]);

        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());
        $mimeType = $file->getMimeType();

        // Validate file type by extension
        if (!in_array($extension, self::ALLOWED_EXTENSIONS)) {
            return response()->json([
                'error' => 'File type not allowed. Supported: images, PDFs, and text files.',
            ], 422);
        }

        // Validate MIME type (P0 security fix)
        if (!in_array($mimeType, self::ALLOWED_MIMES)) {
            return response()->json([
                'error' => 'File type not allowed. MIME type mismatch.',
            ], 422);
        }

        // Determine storage folder and type
        $type = Attachment::determineType($mimeType);
        $folder = match($type) {
            'image' => 'images',
            'document' => 'documents',
            'text' => 'text',
            default => 'files',
        };

        $filename = Str::uuid() . '.' . $extension;
        $path = $file->storeAs($folder . '/' . date('Y/m'), $filename, 'public');

        // If an entry_id is provided, verify ownership and attach
        $entryId = null;
        if ($request->has('entry_id')) {
            $entry = Entry::where('id', $request->entry_id)
                ->where('user_id', Auth::id())
                ->first();

            if ($entry) {
                $entryId = $entry->id;
                $entry->update(['has_images' => true]); // TODO: rename to has_attachments
            }
        }

        $attachment = Attachment::create([
            'user_id' => Auth::id(), // Track uploader for security
            'entry_id' => $entryId,
            'type' => $type,
            'filename' => $filename,
            'original_filename' => $file->getClientOriginalName(),
            'path' => $path,
            'mime_type' => $mimeType,
            'size' => $file->getSize(),
        ]);

        return response()->json([
            'success' => true,
            'attachment' => [
                'id' => $attachment->id,
                'type' => $attachment->type,
                'url' => Storage::url($path),
                'filename' => $attachment->original_filename,
                'original_filename' => $attachment->original_filename,
                'mime_type' => $attachment->mime_type,
                'size' => $attachment->size,
                'human_size' => $attachment->human_size,
            ],
        ]);
    }

    /**
     * Legacy endpoint - upload an image (backwards compatible)
     */
    public function storeImage(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,gif,webp|max:10240',
            'entry_id' => 'nullable|exists:entries,id',
        ]);

        // Convert to generic file upload
        $request->files->set('file', $request->file('image'));
        $response = $this->store($request);

        // Transform response to legacy format
        $data = json_decode($response->getContent(), true);
        if (isset($data['attachment'])) {
            $data['image'] = $data['attachment'];
            unset($data['attachment']);
        }

        return response()->json($data, $response->getStatusCode());
    }

    /**
     * Attach an uploaded attachment to an entry
     */
    public function attachToEntry(Request $request, Attachment $attachment)
    {
        $request->validate([
            'entry_id' => 'required|exists:entries,id',
        ]);

        // Attachment must not already be attached to a different entry
        if ($attachment->entry_id !== null) {
            return response()->json(['error' => 'Attachment already attached'], 400);
        }

        // Security: verify the current user uploaded this attachment
        if ($attachment->user_id !== Auth::id()) {
            abort(403, 'Not authorized to attach this file');
        }

        $entry = Entry::where('id', $request->entry_id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $attachment->update(['entry_id' => $entry->id]);
        $entry->update(['has_images' => true]); // TODO: rename to has_attachments

        return response()->json(['success' => true]);
    }

    /**
     * Delete an attachment
     */
    public function destroy(Attachment $attachment)
    {
        // Security: verify ownership via user_id or entry ownership
        if ($attachment->user_id !== Auth::id()) {
            // Fallback: check entry ownership (for legacy attachments without user_id)
            if ($attachment->entry_id !== null) {
                $entry = Entry::where('id', $attachment->entry_id)
                    ->where('user_id', Auth::id())
                    ->first();

                if (!$entry) {
                    abort(403, 'Not authorized to delete this attachment');
                }
            } else {
                // Unattached file with different user_id
                abort(403, 'Not authorized to delete this attachment');
            }
        }

        // Delete the file from storage
        Storage::disk('public')->delete($attachment->path);

        // Delete the database record
        $attachment->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Download an attachment with security headers
     * Forces download for potentially dangerous file types (SVG, HTML)
     */
    public function download(Attachment $attachment)
    {
        // Security: verify ownership via user_id or entry ownership
        if ($attachment->user_id !== Auth::id()) {
            // Fallback: check entry ownership (for legacy attachments without user_id)
            if ($attachment->entry_id !== null) {
                $entry = Entry::where('id', $attachment->entry_id)
                    ->where('user_id', Auth::id())
                    ->first();

                if (!$entry) {
                    abort(403, 'Not authorized to access this attachment');
                }
            } else {
                // Unattached file with different user_id
                abort(403, 'Not authorized to access this attachment');
            }
        }

        $path = Storage::disk('public')->path($attachment->path);

        if (!file_exists($path)) {
            abort(404, 'File not found');
        }

        // Security headers to prevent XSS from SVG/HTML files
        $headers = [
            'Content-Type' => $attachment->mime_type,
            'Content-Disposition' => 'attachment; filename="' . $attachment->original_filename . '"',
            'Content-Security-Policy' => "sandbox",
            'X-Content-Type-Options' => 'nosniff',
        ];

        return response()->file($path, $headers);
    }

    /**
     * Get text content for text-type attachments
     */
    public function content(Attachment $attachment)
    {
        if (!$attachment->isText()) {
            return response()->json(['error' => 'Not a text file'], 400);
        }

        // Security: verify ownership via user_id or entry ownership
        if ($attachment->user_id !== Auth::id()) {
            // Fallback: check entry ownership (for legacy attachments without user_id)
            if ($attachment->entry_id !== null) {
                $entry = Entry::where('id', $attachment->entry_id)
                    ->where('user_id', Auth::id())
                    ->first();

                if (!$entry) {
                    abort(403, 'Not authorized to access this attachment');
                }
            } else {
                // Unattached file with different user_id
                abort(403, 'Not authorized to access this attachment');
            }
        }

        return response()->json([
            'content' => $attachment->getContents(),
        ]);
    }
}
