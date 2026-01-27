<?php

use App\Http\Controllers\EntryController;
use App\Http\Controllers\AttachmentController;
use App\Http\Controllers\ImageController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// Redirect dashboard to stream
Route::get('/dashboard', function () {
    return redirect()->route('stream');
})->middleware(['auth', 'verified'])->name('dashboard');

// Main app routes
Route::middleware(['auth', 'verified'])->group(function () {
    // Stream (main capture view)
    Route::get('/stream', [EntryController::class, 'index'])->name('stream');
    Route::post('/entries', [EntryController::class, 'store'])->name('entries.store');
    Route::delete('/entries/{entry}', [EntryController::class, 'destroy'])->name('entries.destroy');

    // Attachments (files, images, documents)
    Route::post('/attachments', [AttachmentController::class, 'store'])->name('attachments.store');
    Route::post('/attachments/{attachment}/attach', [AttachmentController::class, 'attachToEntry'])->name('attachments.attach');
    Route::delete('/attachments/{attachment}', [AttachmentController::class, 'destroy'])->name('attachments.destroy');
    Route::get('/attachments/{attachment}/content', [AttachmentController::class, 'content'])->name('attachments.content');

    // Legacy image routes (backwards compatible)
    Route::post('/images', [AttachmentController::class, 'storeImage'])->name('images.store');
    Route::delete('/images/{attachment}', [AttachmentController::class, 'destroy'])->name('images.destroy');

    // Tags API
    Route::get('/api/tags', [EntryController::class, 'searchTags'])->name('tags.search');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
