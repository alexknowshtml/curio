<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Encrypt existing content using Laravel's encryption.
     *
     * We use DB queries directly to avoid the model's encrypted cast
     * trying to decrypt plaintext during the read phase.
     */
    public function up(): void
    {
        // Encrypt entries - read raw, encrypt, write back
        $entries = DB::table('entries')->get();
        foreach ($entries as $entry) {
            // Skip if content looks already encrypted (starts with eyJ = base64 JSON)
            if ($entry->content && !str_starts_with($entry->content, 'eyJ')) {
                $updates = ['content' => Crypt::encryptString($entry->content)];
                if ($entry->content_html) {
                    $updates['content_html'] = Crypt::encryptString($entry->content_html);
                }
                DB::table('entries')->where('id', $entry->id)->update($updates);
            }
        }

        // Encrypt drafts
        $drafts = DB::table('drafts')->get();
        foreach ($drafts as $draft) {
            if ($draft->content && !str_starts_with($draft->content, 'eyJ')) {
                DB::table('drafts')
                    ->where('id', $draft->id)
                    ->update(['content' => Crypt::encryptString($draft->content)]);
            }
        }
    }

    /**
     * Decrypt content back to plaintext.
     */
    public function down(): void
    {
        // Decrypt entries
        $entries = DB::table('entries')->get();
        foreach ($entries as $entry) {
            if ($entry->content && str_starts_with($entry->content, 'eyJ')) {
                try {
                    $updates = ['content' => Crypt::decryptString($entry->content)];
                    if ($entry->content_html && str_starts_with($entry->content_html, 'eyJ')) {
                        $updates['content_html'] = Crypt::decryptString($entry->content_html);
                    }
                    DB::table('entries')->where('id', $entry->id)->update($updates);
                } catch (\Exception $e) {
                    // Skip if can't decrypt
                }
            }
        }

        // Decrypt drafts
        $drafts = DB::table('drafts')->get();
        foreach ($drafts as $draft) {
            if ($draft->content && str_starts_with($draft->content, 'eyJ')) {
                try {
                    DB::table('drafts')
                        ->where('id', $draft->id)
                        ->update(['content' => Crypt::decryptString($draft->content)]);
                } catch (\Exception $e) {
                    // Skip if can't decrypt
                }
            }
        }
    }
};
