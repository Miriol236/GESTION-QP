<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Virement;

class VirementController extends Controller
{
    public function index()
    {
        $virements = Virement::all();
        return response()->json($virements);
    }

    public function indexPublic()
    {
        return response()->json(
            \App\Models\Virement::select('VIR_CODE', 'VIR_LIBELLE')
                ->orderBy('VIR_LIBELLE')
                ->get()
        );
    }

    public function show($code)
    {
        $virement = Virement::find($code);

        if (!$virement) {
            return response()->json($virement);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'VIR_LIBELLE' => 'required|string|max:100',
        ]);

        $exists = Virement::where('VIR_LIBELLE', $request->VIR_LIBELLE)->exists();

        if ($exists) {
            return response()->json(['message' => 'Ce libellé existe déjà.'], 409);
        }

        $virement = new Virement();
        $virement->VIR_LIBELLE = $request->VIR_LIBELLE;
        $virement->VIR_DATE_CREER = now();
        $virement->VIR_CREER_PAR = auth()->check() ? auth()->user()->UTI_NOM." ".auth()->user()->UTI_PRENOM : 'SYSTEM';
        $virement->save();

        return response()->json(['message' => 'virement créé avec succès !'], 201);
    }

    public function update(Request $request, $code)
    {
        $virement = Virement::find($code);

        if (!$virement) {
            return response()->json(['message' => 'Virement non trouvé'], 404);
        }

        $exists = Virement::where('VIR_LIBELLE', $request->VIR_LIBELLE)
            ->where('VIR_CODE', '!=', $code)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Ce libellé existe déjà.'], 409);
        }

        $derniereVersion = ($virement->VIR_VERSION ?? 0) + 1;

        $virement->update([
            'VIR_LIBELLE' => $request->VIR_LIBELLE ?? $virement->VIR_LIBELLE,
            'VIR_DATE_MODIFIER' => now(),
            'VIR_MODIFIER_PAR' => auth()->check() ? auth()->user()->UTI_NOM." ".auth()->user()->UTI_PRENOM : 'SYSTEM',
            'VIR_VERSION' => $derniereVersion,
        ]);

        return response()->json(['message' => 'Virement mis à jour avec succès !']);
    }

    public function destroy($code)
    {
        $virement = Virement::find($code);

        if (!$virement) {
            return response()->json(['message' => 'Virement non trouvé'], 404);
        }

        $virement->delete();

        return response()->json(['message' => 'Virement supprimé avec succès !']);
    }
}
