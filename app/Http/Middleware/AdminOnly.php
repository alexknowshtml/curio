<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminOnly
{
    /**
     * Admin user IDs - only these users can access admin routes
     */
    private const ADMIN_USER_IDS = [1]; // Alex

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user() || !in_array($request->user()->id, self::ADMIN_USER_IDS)) {
            abort(403, 'Access denied.');
        }

        return $next($request);
    }
}
