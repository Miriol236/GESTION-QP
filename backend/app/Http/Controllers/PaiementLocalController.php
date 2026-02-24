<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Paiement;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PaiementLocalController extends Controller
{
    public function index()
    {
        $paiements = Paiement::orderBy('PAI_CODE', 'desc')->get();

        return response()->json($paiements);
    }
}
