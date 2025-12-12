<?php

use Illuminate\Support\Facades\Route;

// Route::get('/', function () {
//     return view('welcome');
// });

Route::get('/{any}', function () {
    return file_get_contents(public_path('front/index.html'));
})->where('any', '^(?!api|front|storage|assets|images|css|js|favicon).*$');

Route::get('/api/documentation', function () {
    return redirect('/api/docs');
});

Route::get('/api/docs', function () {
    return view('l5-swagger::index');
});
