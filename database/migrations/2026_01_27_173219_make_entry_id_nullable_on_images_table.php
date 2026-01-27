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
        Schema::table('images', function (Blueprint $table) {
            // SQLite doesn't support modifying columns directly, so we need to recreate
            // For now, we'll drop the foreign key constraint and recreate the table
        });

        // SQLite workaround: recreate table with nullable entry_id
        DB::statement('PRAGMA foreign_keys=off;');
        DB::statement('
            CREATE TABLE images_new (
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
        DB::statement('INSERT INTO images_new SELECT * FROM images');
        DB::statement('DROP TABLE images');
        DB::statement('ALTER TABLE images_new RENAME TO images');
        DB::statement('PRAGMA foreign_keys=on;');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Note: This will fail if there are images with null entry_id
        DB::statement('PRAGMA foreign_keys=off;');
        DB::statement('
            CREATE TABLE images_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entry_id INTEGER NOT NULL,
                filename VARCHAR(255) NOT NULL,
                path VARCHAR(255) NOT NULL,
                mime_type VARCHAR(255) NOT NULL,
                size INTEGER NOT NULL,
                created_at TIMESTAMP NULL,
                updated_at TIMESTAMP NULL,
                FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE
            )
        ');
        DB::statement('INSERT INTO images_new SELECT * FROM images WHERE entry_id IS NOT NULL');
        DB::statement('DROP TABLE images');
        DB::statement('ALTER TABLE images_new RENAME TO images');
        DB::statement('PRAGMA foreign_keys=on;');
    }
};
