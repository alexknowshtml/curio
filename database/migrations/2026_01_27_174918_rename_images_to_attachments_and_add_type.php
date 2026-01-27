<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // SQLite workaround: recreate table with new name and type field
        DB::statement('PRAGMA foreign_keys=off;');
        DB::statement('
            CREATE TABLE attachments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entry_id INTEGER NULL,
                type VARCHAR(50) NOT NULL DEFAULT "image",
                filename VARCHAR(255) NOT NULL,
                original_filename VARCHAR(255) NULL,
                path VARCHAR(255) NOT NULL,
                mime_type VARCHAR(255) NOT NULL,
                size INTEGER NOT NULL,
                created_at TIMESTAMP NULL,
                updated_at TIMESTAMP NULL,
                FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE
            )
        ');
        DB::statement('INSERT INTO attachments (id, entry_id, type, filename, original_filename, path, mime_type, size, created_at, updated_at)
                       SELECT id, entry_id, "image", filename, filename, path, mime_type, size, created_at, updated_at FROM images');
        DB::statement('DROP TABLE images');
        DB::statement('PRAGMA foreign_keys=on;');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('PRAGMA foreign_keys=off;');
        DB::statement('
            CREATE TABLE images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entry_id INTEGER NULL,
                filename VARCHAR(255) NOT NULL,
                path VARCHAR(255) NOT NULL,
                mime_type VARCHAR(255) NOT NULL,
                size INTEGER NOT NULL,
                created_at TIMESTAMP NULL,
                updated_at TIMESTAMP NULL,
                FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE
            )
        ');
        DB::statement('INSERT INTO images (id, entry_id, filename, path, mime_type, size, created_at, updated_at)
                       SELECT id, entry_id, filename, path, mime_type, size, created_at, updated_at FROM attachments WHERE type = "image"');
        DB::statement('DROP TABLE attachments');
        DB::statement('PRAGMA foreign_keys=on;');
    }
};
