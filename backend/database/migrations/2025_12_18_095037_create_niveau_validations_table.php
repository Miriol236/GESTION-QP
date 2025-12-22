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
        Schema::create('t_niveau_validations', function (Blueprint $table) {
            $table->string('NIV_CODE', 10)->primary();
            $table->string('NIV_LIBELLE');
            $table->integer('NIV_VALEUR');
            $table->date('NIV_DATE_CREER');
            $table->string('NIV_CREER_PAR');
            $table->date('NIV_DATE_MODIFIER')->nullable();
            $table->string('NIV_MODIFIER_PAR')->nullable();
            $table->integer('NIV_VERSION')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_niveau_validations');
    }
};
