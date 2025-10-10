<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/api/documentation', function () {
    return redirect('/api/docs');
});

Route::get('/api/docs', function () {
    return view('l5-swagger::index');
});
