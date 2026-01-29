<?php

use App\Http\Controllers\EntryController;
use App\Http\Controllers\AttachmentController;
use App\Http\Controllers\ImageController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Middleware\AdminOnly;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('home');
    }
    return redirect()->route('login');
});

// Redirect legacy routes
Route::get('/dashboard', fn() => redirect()->route('home'))->middleware(['auth', 'verified'])->name('dashboard');
Route::get('/stream', fn() => redirect()->route('home'))->middleware(['auth', 'verified']);

// Main app routes
Route::middleware(['auth', 'verified'])->group(function () {
    // Home (main capture view) - clean URL routes
    Route::get('/home', [EntryController::class, 'index'])->name('home');

    // Tag filter: /home/@person or /home/#project
    Route::get('/home/{tagSlug}', [EntryController::class, 'index'])
        ->where('tagSlug', '[@#][^/]+')
        ->name('home.tag');

    // Date filter: /home/2026-01-28
    Route::get('/home/{dateSlug}', [EntryController::class, 'index'])
        ->where('dateSlug', '\d{4}-\d{2}-\d{2}')
        ->name('home.date');

    // Combined: /home/@person/2026-01-28
    Route::get('/home/{tagSlug}/{dateSlug}', [EntryController::class, 'index'])
        ->where(['tagSlug' => '[@#][^/]+', 'dateSlug' => '\d{4}-\d{2}-\d{2}'])
        ->name('home.tag.date');

    Route::post('/entries', [EntryController::class, 'store'])->name('entries.store');
    Route::delete('/entries/{entry}', [EntryController::class, 'destroy'])->name('entries.destroy');

    // Attachments (files, images, documents)
    Route::post('/attachments', [AttachmentController::class, 'store'])->name('attachments.store');
    Route::post('/attachments/{attachment}/attach', [AttachmentController::class, 'attachToEntry'])->name('attachments.attach');
    Route::delete('/attachments/{attachment}', [AttachmentController::class, 'destroy'])->name('attachments.destroy');
    Route::get('/attachments/{attachment}/content', [AttachmentController::class, 'content'])->name('attachments.content');
    Route::get('/attachments/{attachment}/download', [AttachmentController::class, 'download'])->name('attachments.download');

    // Legacy image routes (backwards compatible)
    Route::post('/images', [AttachmentController::class, 'storeImage'])->name('images.store');
    Route::delete('/images/{attachment}', [AttachmentController::class, 'destroy'])->name('images.destroy');

    // Tags API
    Route::get('/api/tags', [EntryController::class, 'searchTags'])->name('tags.search');

    // Search API
    Route::get('/api/search', [EntryController::class, 'search'])->name('entries.search');

    // Draft API (auto-save)
    Route::get('/api/draft', [EntryController::class, 'getDraft'])->name('draft.get');
    Route::post('/api/draft', [EntryController::class, 'saveDraft'])->name('draft.save');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Admin routes (restricted to admin users only)
Route::middleware(['auth', AdminOnly::class])->prefix('admin')->group(function () {
    Route::get('/users', [AdminUserController::class, 'index'])->name('admin.users');
    Route::post('/users', [AdminUserController::class, 'store'])->name('admin.users.store');
    Route::patch('/users/{user}', [AdminUserController::class, 'update'])->name('admin.users.update');
    Route::delete('/users/{user}', [AdminUserController::class, 'destroy'])->name('admin.users.destroy');
});

require __DIR__.'/auth.php';
