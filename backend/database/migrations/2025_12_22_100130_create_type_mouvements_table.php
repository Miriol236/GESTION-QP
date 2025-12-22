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
        Schema::create('t_type_mouvements', function (Blueprint $table) {
            $table->string('TYP_CODE', 10)->primary();
            $table->string('TYP_LIBELLE');
            $table->date('TYP_DATE_CREER');
            $table->string('TYP_CREER_PAR');
            $table->date('TYP_DATE_MODIFIER')->nullable();
            $table->string('TYP_MODIFIER_PAR')->nullable();
            $table->integer('TYP_VERSION')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_type_mouvements');
    }
};