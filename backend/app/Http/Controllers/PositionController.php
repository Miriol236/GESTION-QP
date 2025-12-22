<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Position;

class PositionController extends Controller
{
    public function index()
    {
        $positions = Position::all();
        return response()->json($positions);
    }

    public function indexPublic()
    {
        return response()->json(
            \App\Models\Position::select('POS_CODE', 'POS_LIBELLE')
                ->orderBy('POS_LIBELLE')
                ->get()
        );
    }

    public function show($code)
    {
        $positions = Position::find($code);

        if (!$positions) {
            return response()->json(['message' => 'Position non trouvée.'], 404);
        }

        return response()->json($positions);
    }

    public function store(Request $request)
    {
        $request->validate([
            'POS_LIBELLE' => 'required|string|max:100',
        ]);

        $exists = Position::where('POS_LIBELLE', $request->POS_LIBELLE)->exists();

        if ($exists) {
            return response()->json(['message' => 'Ce libellé existe déjà.'], 409);
        }

        $statut = (Position::max('POS_STATUT') ?? 0) + 1;

        $position = new Position();
        $position->POS_LIBELLE = $request->POS_LIBELLE;
        $position->POS_STATUT = $statut;
        $position->POS_DATE_CREER = now();
        $position->POS_CREER_PAR = auth()->check() ? auth()->user()->UTI_NOM." ".auth()->user()->UTI_PRENOM : 'SYSTEM';
        $position->save();

        return response()->json(['message' => 'Position créée avec succès !'], 201);
    }

    public function update(Request $request, $code)
    {
        $position = Position::find($code);

        if (!$position) {
            return response()->json(['message' => 'Position non trouvée'], 404);
        }

        $exists = Position::where('POS_LIBELLE', $request->POS_LIBELLE)
            ->where('POS_CODE', '!=', $code)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Ce libellé existe déjà.'], 409);
        }

        $exist = Position::where('POS_STATUT', $request->POS_STATUT)
            ->where('POS_CODE', '!=', $code)
            ->exists();

        if ($exist) {
            return response()->json(['message' => 'Ce statut existe déjà.'], 409);
        }

        $derniereVersion = ($position->POS_VERSION ?? 0) + 1;

        $position->update([
            'POS_LIBELLE' => $request->POS_LIBELLE ?? $position->POS_LIBELLE,
            'POS_DATE_MODIFIER' => now(),
            'POS_MODIFIER_PAR' => auth()->check() ? auth()->user()->UTI_NOM." ".auth()->user()->UTI_PRENOM : 'SYSTEM',
            'POS_VERSION' => $derniereVersion,
        ]);

        return response()->json(['message' => 'Position mise à jour avec succès !']);
    }

    public function destroy($code)
    {
        $position = Position::find($code);

        if (!$position) {
            return response()->json(['message' => 'Position non trouvée'], 404);
        }

        $position->delete();

        return response()->json(['message' => 'Position supprimée avec succès !']);
    }
}
