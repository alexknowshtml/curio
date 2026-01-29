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
        // SQLite doesn't support adding foreign key constraints to existing tables
        // Use unsignedBigInteger instead of foreignId to avoid constraint issues
        Schema::table('attachments', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable();
        });

        // Add index on entry_id for query performance (P2 fix)
        // Check if index exists first to avoid errors on re-runs
        if (!Schema::hasIndex('attachments', 'attachments_entry_id_index')) {
            Schema::table('attachments', function (Blueprint $table) {
                $table->index('entry_id');
            });
        }

        // Backfill user_id from entry ownership for existing attachments
        DB::statement('UPDATE attachments SET user_id = (SELECT user_id FROM entries WHERE entries.id = attachments.entry_id) WHERE entry_id IS NOT NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attachments', function (Blueprint $table) {
            $table->dropColumn('user_id');
        });

        // Note: leaving the entry_id index as it improves performance
    }
};
