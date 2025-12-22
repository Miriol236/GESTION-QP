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
        Schema::create('t_positions', function (Blueprint $table) {
            $table->string('POS_CODE', 10)->primary();
            $table->string('POS_LIBELLE');
            $table->integer('POS_STATUT');
            $table->date('POS_DATE_CREER');
            $table->string('POS_CREER_PAR');
            $table->date('POS_DATE_MODIFIER')->nullable();
            $table->string('POS_MODIFIER_PAR')->nullable();
            $table->integer('POS_VERSION')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_positions');
    }
};
