<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Paiement;
use App\Models\Beneficiaire;
use Illuminate\Support\Facades\DB;

/**
* @OA\Tag(
*     name="Paiements",
*     description="Gestion des paiements des quôtes-parts"
* )
*/
class PaiementController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/paiements",
     *     tags={"Paiements"},
     *     summary="Lister tous les paiements",
     *     description="Retourne la liste complète des paiements enregistrés.",
     *     security={{"sanctum": {}}},
     *     @OA\Response(response=200, description="Liste des paiements récupérée avec succès")
     * )
     */
    public function index()
    {
        //  Récupère l'utilisateur connecté
        $user = auth()->user();

        //  Vérifie qu'il est bien connecté
        if (!$user) {
            return response()->json(['message' => 'Utilisateur non authentifié.'], 401);
        }

        //  Si l'utilisateur n'a pas de régie, il voit tout
        if (empty($user->REG_CODE)) {
            $paiements = Paiement::orderBy('BEN_CODE', 'desc')->get();
        } else {
            //  Sinon, il ne voit que les paiements de sa régie
            $paiements = Paiement::where('REG_CODE', $user->REG_CODE)
                ->orderBy('BEN_CODE', 'desc')
                ->get();
        }

        return response()->json($paiements);
    }

    /**
     * @OA\Get(
     *     path="/api/paiements/{id}",
     *     tags={"Paiements"},
     *     summary="Afficher les détails d’un paiement",
     *     description="Retourne les informations détaillées d’un paiement spécifique.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(response=200, description="Paiement trouvé"),
     *     @OA\Response(response=404, description="Paiement non trouvé")
     * )
     */
    public function show($id)
    {
        $paiement = Paiement::find($id);

        if (!$paiement) {
            return response()->json(['message' => 'Paiement non trouvé'], 404);
        }

        return response()->json($paiement);
    }

    /**
     * @OA\Post(
     *     path="/api/paiements",
     *     tags={"Paiements"},
     *     summary="Créer un nouveau paiement",
     *     description="Ajoute un nouveau paiement dans le système.",
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"BEN_CODE", "REG_CODE"},
     *             @OA\Property(property="BEN_CODE", type="string"),
     *             @OA\Property(property="REG_CODE", type="string")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Paiement créé avec succès"),
     *     @OA\Response(response=409, description="Paiement déjà existant"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function store(Request $request)
    {
        $request->validate([
            'ECH_CODE' => 'nullable|string|max:10',
            'BEN_CODE' => 'required|string',
        ]);

        $exist = Paiement::where('BEN_CODE', $request->BEN_CODE)
            ->where('ECH_CODE', $request->ECH_CODE)->exists();
        
        if ($exist) {
            return response()->json(['message' => 'Ce bénéficiaire est déjà créé dans le paiement pour cette échéance, veuillez consulter ces informations.'], 409);
        }

         //  Génération automatique du PAI_CODE
        $dernierPaiement = Paiement::where('ECH_CODE', $request->ECH_CODE)
            ->orderBy('PAI_CODE', 'desc')
            ->first();

        // Extraire le numéro d’ordre s’il existe
        if ($dernierPaiement && preg_match('/(\d{4})$/', $dernierPaiement->PAI_CODE, $matches)) {
            $ordre = intval($matches[1]) + 1;
        } else {
            $ordre = 1;
        }

        // Format du numéro d’ordre sur 4 chiffres
        $numeroOrdre = str_pad($ordre, 4, '0', STR_PAD_LEFT);

        //  Générer le PAI_CODE final
        $paiementCode = $request->ECH_CODE . $numeroOrdre;

        $paiement = new Paiement();
        $paiement->PAI_CODE = $paiementCode;

        //  Récupération du bénéficiaire avec sa domiciliation active
        $beneficiaire = Beneficiaire::with(['domiciliations' => function ($query) {
                $query->where('DOM_STATUT', true) //  uniquement le compte actif
                    ->with(['banque', 'guichet']); //  relations jointes
            }])
            ->where('BEN_CODE', $request->BEN_CODE)
            ->first();

        if ($beneficiaire) {
            $paiement->PAI_BENEFICIAIRE = trim($beneficiaire->BEN_NOM . ' ' . $beneficiaire->BEN_PRENOM);

            // On prend la première domiciliation active
            $domiciliation = $beneficiaire->domiciliations->first();

            if ($domiciliation) {
                $paiement->PAI_NUMCPT = $domiciliation->DOM_NUMCPT;
                $paiement->PAI_RIB = $domiciliation->DOM_RIB;

                if ($domiciliation->banque) {
                    $paiement->PAI_BNQ_NUMERO = $domiciliation->banque->BNQ_NUMERO;
                }

                if ($domiciliation->guichet) {
                    $paiement->PAI_GUI_CODE = $domiciliation->guichet->GUI_CODE;
                }
            }
        }

        $paiement->PAI_STATUT       = false;
        $paiement->PAI_VIREMENT     = 0;
        $paiement->PAI_DATE_CREER   = now();
        $paiement->PAI_CREER_PAR    = auth()->check()
            ? auth()->user()->UTI_NOM . ' ' . auth()->user()->UTI_PRENOM
            : 'SYSTEM';
        $paiement->BEN_CODE         = $request->BEN_CODE;
        $paiement->REG_CODE         = auth()->check() ? auth()->user()->REG_CODE : 'SYSTEM';
        $paiement->ECH_CODE         = $request->ECH_CODE;

        $paiement->save();

        return response()->json([
            'message'  => 'Bénéficiaire créé dans paiement avec succès',
            'PAI_CODE' => $paiement->PAI_CODE,
        ], 201);
    }

    /**
     * @OA\Put(
     *     path="/api/paiements/{id}",
     *     tags={"Paiements"},
     *     summary="Mettre à jour un paiement",
     *     description="Modifie les informations d’un paiement existant.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\RequestBody(
     *         required=false,
     *         @OA\JsonContent(
     *             @OA\Property(property="BEN_CODE", type="string"),
     *             @OA\Property(property="REG_CODE", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Paiement mis à jour avec succès"),
     *     @OA\Response(response=404, description="Paiement non trouvé"),
     *     @OA\Response(response=409, description="Conflit : Paiement déjà existant"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function update(Request $request, $id)
    {
        $paiement = Paiement::find($id);

        if (!$paiement) {
            return response()->json(['message' => 'Information non trouvée'], 404);
        }

        // Validation minimale
        $request->validate([
            'BEN_CODE' => 'required|string',
            'ECH_CODE' => 'required|string',
        ]);

        // Récupération du bénéficiaire avec la domiciliation active
        $beneficiaire = Beneficiaire::with(['domiciliations' => function ($query) {
                $query->where('DOM_STATUT', true)
                    ->with(['banque', 'guichet']);
            }])
            ->where('BEN_CODE', $request->BEN_CODE)
            ->first();

        // Valeurs par défaut
        $nomComplet = null;
        $bnqNumero  = null;
        $guiCode    = null;
        $numCpt     = null;
        $rib        = null;

        if ($beneficiaire) {
            $nomComplet = trim($beneficiaire->BEN_NOM . ' ' . $beneficiaire->BEN_PRENOM);

            // Récupération de la domiciliation active
            $domiciliation = $beneficiaire->domiciliations->first();

            if ($domiciliation) {
                $numCpt = $domiciliation->DOM_NUMCPT;
                $rib    = $domiciliation->DOM_RIB;

                if ($domiciliation->banque) {
                    $bnqNumero = $domiciliation->banque->BNQ_NUMERO;
                }

                if ($domiciliation->guichet) {
                    $guiCode = $domiciliation->guichet->GUI_CODE;
                }
            }
        }

        // Incrémentation de la version
        $nouvelleVersion = ($paiement->PAI_VERSION ?? 0) + 1;

        // Mise à jour des données
        $paiement->update([
            'PAI_BENEFICIAIRE'  => $nomComplet,
            'PAI_BNQ_NUMERO'    => $bnqNumero,
            'PAI_GUI_CODE'      => $guiCode,
            'PAI_NUMCPT'        => $numCpt,
            'PAI_RIB'           => $rib,
            'PAI_DATE_MODIFIER' => now(),
            'PAI_MODIFIER_PAR'  => auth()->check()
                ? auth()->user()->UTI_NOM . " " . auth()->user()->UTI_PRENOM
                : 'SYSTEM',
            'PAI_VERSION'       => $nouvelleVersion,
            'BEN_CODE'          => $request->BEN_CODE ?? $paiement->BEN_CODE,
            'REG_CODE'          => auth()->check() ? auth()->user()->REG_CODE : $paiement->REG_CODE,
            'ECH_CODE'          => $request->ECH_CODE ?? $paiement->ECH_CODE,
        ]);

        return response()->json([
            'message' => 'Informations du bénéficiaire pour le paiement sont mises à jour avec succès',
            'PAI_CODE' => $paiement->PAI_CODE,
        ]);
    }

    /**
     * @OA\Delete(
     *     path="/api/paiements/{code}",
     *     tags={"Paiements"},
     *     summary="Supprimer un paiement",
     *     description="Supprime un paiement par son code.",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(
     *         name="code",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(response=200, description="Paiement supprimé avec succès"),
     *     @OA\Response(response=404, description="Paiement non trouvé"),
     *     @OA\Response(response=401, description="Non authentifié")
     * )
     */
    public function destroy($code)
    {
        $paiement = Paiement::find($code);

        if (!$paiement) {
            return response()->json(['message' => 'Information non trouvée'], 404);
        }

        $paiement->delete();
        return response()->json(['message' => 'Informations du bénéficiaire pour le paiement supprimées avec succès']);
    }

    private function traiterValidationPaiements(array $ids, callable $callback)
    {
        $results = ['success' => [], 'failed' => []];

        DB::beginTransaction();
        try {
            $paiements = Paiement::whereIn('PAI_CODE', $ids)->get()->keyBy('PAI_CODE');

            foreach ($ids as $code) {
                $paiement = $paiements->get($code);
                if (!$paiement) {
                    $results['failed'][] = ['PAI_CODE' => $code, 'reason' => 'Paiement introuvable.'];
                    continue;
                }

                $callback($paiement, $results);
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        return $results;
    }

    public function validerStatut(Request $request, $id = null)
    {
        $ids = $request->input('ids', []);
        if ($id !== null) $ids = [$id];
        if (empty($ids)) {
            return response()->json(['message' => 'Aucun identifiant fourni.'], 400);
        }

        try {
            $results = $this->traiterValidationPaiements($ids, function ($paiement, &$results) {
                if ($paiement->PAI_STATUT == 1) {
                    $results['failed'][] = ['PAI_CODE' => $paiement->PAI_CODE, 'reason' => 'Déjà validé.'];
                    return;
                }

                $paiement->PAI_STATUT = 1;
                $paiement->PAI_DATE_MODIFIER = now();
                $paiement->PAI_MODIFIER_PAR = auth()->check()
                    ? auth()->user()->UTI_NOM . ' ' . auth()->user()->UTI_PRENOM
                    : 'SYSTEM';
                $paiement->save();

                $results['success'][] = ['PAI_CODE' => $paiement->PAI_CODE];
            });

            return response()->json([
                'message' => 'Validation des statuts terminée.',
                'updated' => count($results['success']),
                'failed' => $results['failed'],
                'success' => $results['success']
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la validation des statuts.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function validerVirement(Request $request, $id = null)
    {
        $ids = $request->input('ids', []);
        if ($id !== null) $ids = [$id];
        if (empty($ids)) {
            return response()->json(['message' => 'Aucun identifiant fourni.'], 400);
        }

        try {
            $results = $this->traiterValidationPaiements($ids, function ($paiement, &$results) {
                if ($paiement->PAI_STATUT != 1) {
                    $results['failed'][] = ['PAI_CODE' => $paiement->PAI_CODE, 'reason' => 'Le paiement doit être validé avant le virement.'];
                    return;
                }

                $paiement->PAI_VIREMENT = ($paiement->PAI_VIREMENT ?? 0) + 1;
                $paiement->PAI_DATE_MODIFIER = now();
                $paiement->PAI_MODIFIER_PAR = auth()->check()
                    ? auth()->user()->UTI_NOM . ' ' . auth()->user()->UTI_PRENOM
                    : 'SYSTEM';
                $paiement->save();

                $results['success'][] = [
                    'PAI_CODE' => $paiement->PAI_CODE,
                    'nouvelle_valeur_virement' => $paiement->PAI_VIREMENT
                ];
            });

            return response()->json([
                'message' => 'Validation des virements terminée.',
                'updated' => count($results['success']),
                'failed' => $results['failed'],
                'success' => $results['success']
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la validation des virements.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

}
