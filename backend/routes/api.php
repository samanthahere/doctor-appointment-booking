<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DoctorController;
use App\Http\Controllers\AppointmentController;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])->name('login');

Route::get('/doctors', [DoctorController::class, 'index']);
Route::get('/doctors/{id}', [DoctorController::class, 'show']);
Route::get('/doctors/{id}/slots', [DoctorController::class, 'slots']);

// Authenticated routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Doctor availability slot management
    Route::post('/doctor/slots', [DoctorController::class, 'addSlot']);
    Route::get('/doctor/slots/my', [DoctorController::class, 'mySlots']);
    Route::delete('/doctor/slots/{id}', [DoctorController::class, 'deleteSlot']);

    // Appointments
    Route::post('/appointments', [AppointmentController::class, 'book']);
    Route::get('/appointments/my', [AppointmentController::class, 'myAppointments']);
    Route::put('/appointments/{id}/cancel', [AppointmentController::class, 'cancel']);
    Route::put('/appointments/{id}/status', [AppointmentController::class, 'updateStatus']);
});
