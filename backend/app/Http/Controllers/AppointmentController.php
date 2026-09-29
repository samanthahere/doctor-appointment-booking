<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Doctor;
use Illuminate\Http\Request;

class AppointmentController extends Controller
{
    public function book(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'doctor_id' => 'required|exists:doctors,id',
            'appointment_date' => 'required|date|after_or_equal:today',
            'appointment_time' => 'required|string',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Prevent doctor from booking an appointment with themselves
        if ($user->role === 'doctor' && $user->doctor && $user->doctor->id == $validated['doctor_id']) {
            return response()->json([
                'message' => 'Doctors cannot book appointments with themselves.',
            ], 422);
        }

        // Normalize time (e.g. "09:00" to "09:00:00" or vice versa for consistent comparison)
        $time = date('H:i:s', strtotime($validated['appointment_time']));

        // Check if doctor already has an active appointment for that date and time
        $existing = Appointment::where('doctor_id', $validated['doctor_id'])
            ->where('appointment_date', $validated['appointment_date'])
            ->where('appointment_time', $time)
            ->whereIn('status', ['pending', 'confirmed'])
            ->exists();

        if ($existing) {
            return response()->json([
                'message' => 'This doctor already has a booked appointment at this date and time. Please pick another time.',
            ], 422);
        }

        $appointment = Appointment::create([
            'patient_id' => $user->id,
            'doctor_id' => $validated['doctor_id'],
            'appointment_date' => $validated['appointment_date'],
            'appointment_time' => $time,
            'status' => 'pending',
            'notes' => $validated['notes'] ?? null,
        ]);

        $appointment->load(['doctor.user:id,name,email', 'patient:id,name,email']);

        return response()->json([
            'message' => 'Appointment booked successfully.',
            'appointment' => $appointment,
        ], 201);
    }

    public function myAppointments(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'doctor' && $user->doctor) {
            $appointments = Appointment::with(['patient:id,name,email', 'doctor.user:id,name,email'])
                ->where('doctor_id', $user->doctor->id)
                ->orderBy('appointment_date', 'asc')
                ->orderBy('appointment_time', 'asc')
                ->get();
        } else {
            $appointments = Appointment::with(['doctor.user:id,name,email', 'doctor'])
                ->where('patient_id', $user->id)
                ->orderBy('appointment_date', 'asc')
                ->orderBy('appointment_time', 'asc')
                ->get();
        }

        return response()->json($appointments);
    }

    public function cancel(Request $request, $id)
    {
        $user = $request->user();
        $appointment = Appointment::with(['doctor', 'patient'])->findOrFail($id);

        $isPatient = $appointment->patient_id === $user->id;
        $isDoctor = $user->doctor && $appointment->doctor_id === $user->doctor->id;

        if (!$isPatient && !$isDoctor && $user->role !== 'admin') {
            return response()->json([
                'message' => 'You are not authorized to cancel this appointment.',
            ], 403);
        }

        if ($appointment->status === 'cancelled') {
            return response()->json([
                'message' => 'Appointment is already cancelled.',
                'appointment' => $appointment,
            ]);
        }

        $appointment->status = 'cancelled';
        $appointment->save();

        return response()->json([
            'message' => 'Appointment cancelled successfully.',
            'appointment' => $appointment,
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $user = $request->user();
        $appointment = Appointment::with(['doctor', 'patient'])->findOrFail($id);

        $isDoctor = $user->doctor && $appointment->doctor_id === $user->doctor->id;

        if (!$isDoctor && $user->role !== 'admin') {
            return response()->json([
                'message' => 'Only the doctor or an admin can update appointment status.',
            ], 403);
        }

        $request->validate([
            'status' => 'required|in:pending,confirmed,completed,cancelled',
        ]);

        $appointment->status = $request->status;
        $appointment->save();

        return response()->json([
            'message' => 'Appointment status updated to ' . $request->status . '.',
            'appointment' => $appointment,
        ]);
    }
}
