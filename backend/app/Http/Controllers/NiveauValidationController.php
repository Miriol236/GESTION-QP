<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\NiveauValidation;

class NiveauValidationController extends Controller
{
    public function index()
    {
        $niv_vals = NiveauValidation::all();
        return response()->json($niv_vals);
    }

    public function show($code)
    {
        $niv_vals = NiveauValidation::find($code);

        if (!$niv_vals) {
            return response()->json(['message' => 'Niveau de validation non trouvé.'], 404);
        }

        return response()->json($niv_vals);
    }

    public function store(Request $request)
    {
        $request->validate([
            'NIV_LIBELLE' => 'required|string|max:100',
            'NIV_VALEUR' => 'required|integer|unique:t_niveau_validations,NIV_VALEUR',
        ],
        [
            'NIV_VALEUR.unique' => 'Cette valeur exite déjà',
        ]);

        $exists = NiveauValidation::where('NIV_LIBELLE', $request->NIV_LIBELLE)->exists();

        if ($exists) {
            return response()->json(['message' => 'Ce libellé existe déjà.'], 409);
        }

        $niv_val = new NiveauValidation();
        $niv_val->NIV_LIBELLE = $request->NIV_LIBELLE;
        $niv_val->NIV_VALEUR = $request->NIV_VALEUR;
        $niv_val->NIV_DATE_CREER = now();
        $niv_val->NIV_CREER_PAR = auth()->check() ? auth()->user()->UTI_NOM." ".auth()->user()->UTI_PRENOM : 'SYSTEM';
        $niv_val->save();

        return response()->json(['message' => 'Niveau de validation créé avec succès !'], 201);
    }

    public function update(Request $request, $code)
    {
        $niv_val = NiveauValidation::find($code);

        if (!$niv_val) {
            return response()->json(['message' => 'Niveau de validation non trouvé'], 404);
        }

        $exists = NiveauValidation::where('NIV_LIBELLE', $request->NIV_LIBELLE)
            ->where('NIV_CODE', '!=', $code)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Ce libellé existe déjà.'], 409);
        }

        $exist = NiveauValidation::where('NIV_VALEUR', $request->NIV_VALEUR)
            ->where('NIV_CODE', '!=', $code)
            ->exists();

        if ($exist) {
            return response()->json(['message' => 'Cette valeur existe déjà.'], 409);
        }

        $derniereVersion = ($niv_val->NIV_VERSION ?? 0) + 1;

        $niv_val->update([
            'NIV_LIBELLE' => $request->NIV_LIBELLE ?? $niv_val->NIV_LIBELLE,
            'NIV_VALEUR' => $request->NIV_VALEUR ?? $niv_val->NIV_VALEUR,
            'NIV_DATE_MODIFIER' => now(),
            'NIV_MODIFIER_PAR' => auth()->check() ? auth()->user()->UTI_NOM." ".auth()->user()->UTI_PRENOM : 'SYSTEM',
            'NIV_VERSION' => $derniereVersion,
        ]);

        return response()->json(['message' => 'Niveau de validation mis à jour avec succès !']);
    }

    public function destroy($code)
    {
        $niv_val = NiveauValidation::find($code);

        if (!$niv_val) {
            return response()->json(['message' => 'Niveau de validation non trouvé'], 404);
        }

        $niv_val->delete();

        return response()->json(['message' => 'Niveau de validation supprimé avec succès !']);
    }
}
