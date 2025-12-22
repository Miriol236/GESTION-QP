<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('t_beneficiaires', function (Blueprint $table) {
            $table->integer('BEN_STATUT')->nullable()->after('BEN_SEXE');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('t_beneficiaires', function (Blueprint $table) {
            $table->dropColumn('BEN_STATUT');
        });
    }
};
