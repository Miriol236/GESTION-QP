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
        Schema::create('T_BENEFICIAIRES', function (Blueprint $table) {
            $table->string('BEN_CODE', 10)->primary();
            $table->string('BEN_MATRICULE', 10)->unique();
            $table->string('BEN_NOM');
            $table->string('BEN_PRENOM');
            $table->string('BEN_SEXE');
            $table->date('BEN_DATE_CREER');
            $table->string('BEN_CREER_PAR');
            $table->date('BEN_DATE_MODIFIER')->nullable();
            $table->string('BEN_MODIFIER_PAR')->nullable();
            $table->integer('BEN_VERSION')->nullable();
            $table->string('TYP_CODE', 10);
            $table->string('FON_CODE', 10);
            $table->string('GRD_CODE', 10);
            $table->foreign('TYP_CODE')->references('TYP_CODE')->on('T_TYPE_BENEFICIAIRES');
            $table->foreign('FON_CODE')->references('FON_CODE')->on('T_FONCTIONS');
            $table->foreign('GRD_CODE')->references('GRD_CODE')->on('T_GRADES');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('T_BENEFICIAIRES');
    }
};
