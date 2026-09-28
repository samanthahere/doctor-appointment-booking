<?php

namespace App\Http\Controllers;

use App\Models\Doctor;
use App\Models\AvailabilitySlot;
use Illuminate\Http\Request;

class DoctorController extends Controller
{
    public function index(Request $request)
    {
        $query = Doctor::with('user:id,name,email')
            ->where('is_approved', true);

        if ($request->filled('specialty')) {
            $query->where('specialty', 'like', '%' . $request->specialty . '%');
        }

        $doctors = $query->get();

        return response()->json($doctors);
    }

    public function show($id)
    {
        $doctor = Doctor::with(['user:id,name,email', 'availabilitySlots'])
            ->where('is_approved', true)
            ->findOrFail($id);

        return response()->json($doctor);
    }

    public function slots($id)
    {
        $doctor = Doctor::findOrFail($id);
        $slots = $doctor->availabilitySlots()
            ->orderByRaw("FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')")
            ->orderBy('start_time')
            ->get();

        return response()->json($slots);
    }

    public function addSlot(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'doctor' || !$user->doctor) {
            return response()->json([
                'message' => 'Only registered doctors can add availability slots.',
            ], 403);
        }

        $validated = $request->validate([
            'day_of_week' => 'required|in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
        ]);

        $slot = $user->doctor->availabilitySlots()->create($validated);

        return response()->json([
            'message' => 'Availability slot added successfully.',
            'slot' => $slot,
        ], 201);
    }

    public function mySlots(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'doctor' || !$user->doctor) {
            return response()->json([
                'message' => 'Only registered doctors can view doctor slots.',
            ], 403);
        }

        $slots = $user->doctor->availabilitySlots()
            ->orderByRaw("FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')")
            ->orderBy('start_time')
            ->get();

        return response()->json($slots);
    }

    public function deleteSlot(Request $request, $id)
    {
        $user = $request->user();

        if ($user->role !== 'doctor' || !$user->doctor) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $slot = AvailabilitySlot::where('id', $id)
            ->where('doctor_id', $user->doctor->id)
            ->firstOrFail();

        $slot->delete();

        return response()->json(['message' => 'Slot deleted successfully.']);
    }
}
