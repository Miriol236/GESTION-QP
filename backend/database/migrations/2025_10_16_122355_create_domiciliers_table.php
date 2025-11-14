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
        Schema::create('T_DOMICILIERS', function (Blueprint $table) {
            $table->string('DOM_CODE', 10)->primary();
            $table->string('DOM_NUMCPT')->nullable();
            $table->string('DOM_RIB', 2)->nullable();
            $table->boolean('DOM_STATUT');
            $table->date('DOM_DATE_CREER');
            $table->string('DOM_CREER_PAR');
            $table->date('DOM_DATE_MODIFIER')->nullable();
            $table->string('DOM_MODIFIER_PAR')->nullable();
            $table->integer('DOM_VERSION')->nullable();
            $table->string('BEN_CODE', 15);
            $table->string('BNQ_CODE', 10);
            $table->string('GUI_ID', 10);
            $table->foreign('BEN_CODE')->references('BEN_CODE')->on('T_BENEFICIAIRES');
            $table->foreign('BNQ_CODE')->references('BNQ_CODE')->on('T_BANQUES');
            $table->foreign('GUI_ID')->references('GUI_ID')->on('T_GUICHETS');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('T_DOMICILIERS');
    }
};
