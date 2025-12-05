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
        Schema::create('T_VIREMENTS', function (Blueprint $table) {
            $table->integer('VIR_CODE')->primary();
            $table->string('VIR_LIBELLE');
            $table->date('VIR_DATE_CREER');
            $table->string('VIR_CREER_PAR');
            $table->date('VIR_DATE_MODIFIER')->nullable();
            $table->string('VIR_MODIFIER_PAR')->nullable();
            $table->integer('VIR_VERSION')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('T_VIREMENTS');
    }
};
