<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Echeance;
use Illuminate\Support\Facades\DB;

/**
 * @OA\Tag(
 *     name="Echeances",
 *     description="Gestion des échéances"
 * )
 */
class EcheanceController extends Controller
{
    
    /**
     * @OA\Get(
     *     path="/api/echeances",
     *     tags={"Echeances"},
     *     summary="Lister toutes les échéances",
     *     description="Retourne la liste complète des échéances.",
     *     security={{"sanctum": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="Liste des échéances récupérée avec succès"
     *     )
     * )
     */
    public function index()
    {
        $echeances = Echeance::orderBy('ECH_CODE', 'desc')->get();
        return response()->json($echeances);
    }

    /**
     * @OA\Get(
     *     path="/api/echeances-publique",
     *     tags={"Echeances"},
     *     summary="Lister toutes les échéances (public)",
     *     description="Retourne la liste des échéances accessibles publiquement.",
     *     @OA\Response(
     *         response=200,
     *         description="Liste des échéances récupérée avec succès",
     *         @OA\JsonContent(type="array", @OA\Items(type="object", @OA\Property(property="ECH_CODE", type="string"), @OA\Property(property="ECH_LIBELLE", type="string")))
     *     )
     * )
     */
    public function indexPublic()
    {
        return response()->json(
            \App\Models\Echeance::select('ECH_CODE', 'ECH_LIBELLE')
                ->orderByDesc('ECH_CODE')
                ->get()
        );
    }

    public function getAnciennesEcheances()
    {
        return response()->json(
            \App\Models\Echeance::select('ECH_CODE', 'ECH_LIBELLE')
                ->where('ECH_STATUT', 0)
                ->orderByDesc('ECH_CODE')
                ->take(3) // afficher seulement les 3 dernières échéances
                ->get()
        );
    }

    /**
     * @OA\Get(
     *     path="/api/echeances/{code}",
     *     tags={"Echeances"},
     *     summary="Afficher une échéance",
     *     description="Retourne les détails d’une échéance à partir de son code.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="code",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(response=200, description="Echéance trouvée"),
     *     @OA\Response(response=404, description="Echéance non trouvée")
     * )
     */
    public function show($code)
    {
        $echeance = Echeance::find($code);

        if (!$echeance) {
            return response()->json(['message' => 'Echéance non trouvée.'], 404);
        }

        return response()->json($echeance);
    }

    /**
     * @OA\Post(
     *     path="/api/echeances",
     *     tags={"Echeances"},
     *     summary="Créer une nouvelle échéance",
     *     description="Ajoute une nouvelle échéance.",
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"ECH_LIBELLE"},
     *             @OA\Property(property="ECH_LIBELLE", type="string")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Echéance créée avec succès"),
     *     @OA\Response(response=409, description="Une échéance avec ce nom existe déjà"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function store(Request $request)
    {
        $request->validate([
            'ECH_LIBELLE' => 'required|string|max:100',
            'ECH_ANNEE' => 'required|digits:4',
            'ECH_MOIS' => 'required|digits:2',
        ]);

        // Vérifier doublon libellé
        if (Echeance::where('ECH_LIBELLE', $request->ECH_LIBELLE)->exists()) {
            return response()->json(['message' => 'Une échéance avec ce nom existe déjà.'], 409);
        }

        // Désactiver les autres échéances
        Echeance::where('ECH_STATUT', true)->update(['ECH_STATUT' => false]);

        // Générer le code ECH_CODE sans l'enregistrer dans une colonne séparée
        $ECH_CODE = $request->ECH_ANNEE . $request->ECH_MOIS; // exemple 202512

        // Vérifier duplicata de code
        if (Echeance::where('ECH_CODE', $ECH_CODE)->exists()) {
            return response()->json(['message' => 'Cette échéance existe déjà.'], 409);
        }

        // Créer l'échéance
        $echeance = new Echeance();
        $echeance->ECH_CODE = $ECH_CODE; // <-- On stocke uniquement dans la colonne existante
        $echeance->ECH_LIBELLE = $request->ECH_LIBELLE;
        $echeance->ECH_STATUT = true;
        $echeance->ECH_DATE_CREER = now();
        $echeance->ECH_CREER_PAR = auth()->check()
            ? auth()->user()->UTI_NOM . ' ' . auth()->user()->UTI_PRENOM
            : 'SYSTEM';
        
        $echeance->save();

        return response()->json(['message' => 'Échéance créée avec succès !'], 201);
    }

    /**
     * @OA\Put(
     *     path="/api/echeances/{code}",
     *     tags={"Echeances"},
     *     summary="Mettre à jour une échéance",
     *     description="Modifie les informations d’une échéance existante.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="code",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="ECH_LIBELLE", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Echéance mise à jour avec succès"),
     *     @OA\Response(response=404, description="Echéance non trouvée"),
     *     @OA\Response(response=409, description="Une échéance avec ce nom existe déjà"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function update(Request $request, $code)
    {
        $echeance = Echeance::find($code);

        if (!$echeance) {
            return response()->json(['message' => 'Echéance non trouvée'], 404);
        }

        // Recalcul du nouveau code si année/mois modifiés
        if ($request->ECH_ANNEE && $request->ECH_MOIS) {
            $nouveauCode = $request->ECH_ANNEE . str_pad($request->ECH_MOIS, 2, '0', STR_PAD_LEFT);

            // Vérifier si ce nouveau code existe déjà
            if ($nouveauCode != $code && Echeance::where('ECH_CODE', $nouveauCode)->exists()) {
                return response()->json([
                    'message' => 'Une échéance avec cette année et ce mois existe déjà.'
                ], 409);
            }
        } else {
            $nouveauCode = $code; // aucune modification
        }

        // Vérifier le libellé
        $exists = Echeance::where('ECH_LIBELLE', $request->ECH_LIBELLE)
            ->where('ECH_CODE', '!=', $code)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Une échéance avec ce nom existe déjà.'
            ], 409);
        }

        $derniereVersion = ($echeance->ECH_VERSION ?? 0) + 1;

        // Mise à jour des valeurs
        $echeance->update([
            'ECH_CODE' => $nouveauCode,
            'ECH_LIBELLE' => $request->ECH_LIBELLE ?? $echeance->ECH_LIBELLE,
            'ECH_DATE_MODIFIER' => now(),
            'ECH_MODIFIER_PAR' => auth()->check()
                ? auth()->user()->UTI_NOM . " " . auth()->user()->UTI_PRENOM
                : 'SYSTEM',
            'ECH_VERSION' => $derniereVersion,
        ]);

        return response()->json([
            'message' => 'Echéance mise à jour avec succès !'
        ]);
    }

    /**
     * @OA\Delete(
     *     path="/api/echeances/{code}",
     *     tags={"Echeances"},
     *     summary="Supprimer une échéance",
     *     description="Supprime une échéance existante par son code.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="code",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(response=200, description="Echéance supprimée avec succès"),
     *     @OA\Response(response=404, description="Echéance non trouvée"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */  
    public function destroy($code)
    {
        $echeance = Echeance::find($code);

        if (!$echeance) {
            return response()->json(['message' => 'Échéance non trouvée'], 404);
        }

        // Garder en mémoire si elle était active (cast en bool pour sécurité)
        $wasActive = (bool) $echeance->ECH_STATUT;

        // Utiliser une transaction pour être sûr que tout est atomique
        DB::beginTransaction();
        try {
            $echeance->delete();

            if ($wasActive) {
                // Récupérer la "dernière" échéance restante par ECH_CODE (non supprimée)
                // Si tu utilises SoftDeletes, la requête exclut automatiquement les "trashed"
                $lastEcheance = Echeance::orderByDesc('ECH_CODE')->first();

                if ($lastEcheance) {
                    // Eviter mass-assignment : assigner et save() pour contourner le fillable
                    $lastEcheance->ECH_STATUT = true;
                    $saved = $lastEcheance->save();

                    if (! $saved) {
                        // rollback et message d'erreur si le save échoue
                        DB::rollBack();
                        return response()->json(['message' => 'Impossible d\'activer la dernière échéance'], 500);
                    }

                    // Désactiver au besoin les autres (garantir unicité)
                    Echeance::where('ECH_CODE', '!=', $lastEcheance->ECH_CODE)
                            ->where('ECH_STATUT', true)
                            ->update(['ECH_STATUT' => false]);
                }
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            // Pour le debug local : renvoyer l'erreur (en prod, loguer au lieu de renvoyer)
            return response()->json([
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        }

        return response()->json(['message' => 'Échéance supprimée avec succès !']);
    }

    /**
     * @OA\Put(
     *     path="/api/echeances/{code}/activer",
     *     tags={"Echeances"},
     *     summary="Activer une échéance",
     *     description="Active une échéance spécifique et désactive les autres.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="code",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(response=200, description="Échéance activée avec succès"),
     *     @OA\Response(response=404, description="Échéance non trouvée"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function activer($code)
    {
        $echeance = Echeance::find($code);

        if (!$echeance) {
            return response()->json(['message' => 'Échéance non trouvée'], 404);
        }

        //  Désactiver toutes les autres échéances
        Echeance::where('ECH_STATUT', true)->update(['ECH_STATUT' => false]);

        //  Activer celle sélectionnée
        $echeance->ECH_STATUT = true;
        $echeance->save();

        return response()->json(['message' => 'Échéance activée avec succès !']);
    }

    public function active()
    {
        $echeance = Echeance::where('ECH_STATUT', true)->first();

        if (!$echeance) {
            return response()->json(['message' => 'Aucune échéance active'], 404);
        }

        return response()->json($echeance);
    }

}
