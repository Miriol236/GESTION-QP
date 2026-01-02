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
        Schema::create('t_paiements', function (Blueprint $table) {
            $table->string('PAI_CODE', 10)->primary();
            $table->string('PAI_BENEFICIAIRE')->nullable();
            $table->string('TYP_BENEFICIAIRE')->nullable();
            $table->string('PAI_BNQ_LIB')->nullable();
            $table->string('PAI_BNQ_CODE', 10)->nullable();
            $table->string('PAI_GUI_CODE', 10)->nullable();
            $table->string('PAI_NUMCPT')->nullable();
            $table->string('PAI_RIB', 2)->nullable();
            $table->string('PAI_REG_LIB')->nullable();
            $table->integer('PAI_STATUT')->nullable();
            $table->integer('PAI_VIREMENT')->nullable();
            $table->foreign('PAI_VIREMENT')->references('VIR_CODE')->on('t_virements');
            $table->date('PAI_DATE_VIREMENT')->nullable();
            $table->date('PAI_DATE_CREER')->nullable();
            $table->string('PAI_CREER_PAR')->nullable();
            $table->date('PAI_DATE_MODIFIER')->nullable();
            $table->string('PAI_MODIFIER_PAR')->nullable();
            $table->integer('PAI_VERSION')->nullable();
            $table->string('BEN_CODE', 12);
            $table->string('REG_CODE', 10);
            $table->string('ECH_CODE', 10);
            $table->foreign('BEN_CODE')->references('BEN_CODE')->on('t_beneficiaires');
            $table->foreign('REG_CODE')->references('REG_CODE')->on('t_regies');
            $table->foreign('ECH_CODE')->references('ECH_CODE')->on('t_echeances');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_paiements');
    }
};
