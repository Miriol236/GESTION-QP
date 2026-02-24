<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Beneficiaire;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class BeneficiaireLocalController extends Controller
{
    public function index()
    {
        $beneficiaires = Beneficiaire::orderBy('BEN_NOM', 'asc')->get();

        return response()->json($beneficiaires);
    }
}
