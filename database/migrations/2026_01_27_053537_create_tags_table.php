<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tags', function (Blueprint $table) {
            $table->id();
            $table->string('sigil', 1);  // #, @, $, !, ~
            $table->string('name');
            $table->timestamps();

            $table->unique(['sigil', 'name']);
        });

        // Pivot table for entry-tag relationship
        Schema::create('entry_tag', function (Blueprint $table) {
            $table->foreignId('entry_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tag_id')->constrained()->cascadeOnDelete();
            $table->primary(['entry_id', 'tag_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('entry_tag');
        Schema::dropIfExists('tags');
    }
};
