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
        Schema::create('t_historiques_validations', function (Blueprint $table) {
            $table->string('VAL_CODE', 15)->primary();
            $table->string('VAL_BEN_CODE', 12)->nullable();
            $table->string('VAL_DOM_CODE', 8)->nullable();
            $table->string('VAL_PAI_CODE', 12)->nullable();
            $table->string('VAL_BEN_NOM_PRE')->nullable();
            $table->string('VAL_BNQ_CODE', 10)->nullable();
            $table->string('VAL_BNQ_LIBELLE')->nullable();
            $table->string('VAL_GUI_CODE', 10)->nullable();
            $table->string('VAL_GUI_NOM')->nullable();
            $table->string('VAL_NUMCPT')->nullable();
            $table->string('VAL_CLE_RIB', 2)->nullable();
            $table->date('VAL_DATE');
            $table->time('VAL_HEURE');
            $table->integer('VAL_NIV');
            $table->string('VAL_UTI_CODE', 4);
            $table->string('VAL_CREER_PAR');
            $table->string('MVT_CODE', 15);
            $table->foreign('MVT_CODE')->references('MVT_CODE')->on('t_mouvements');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_historiques_validations');
    }
};