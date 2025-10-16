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
        Schema::create('T_REGIES', function (Blueprint $table) {
            $table->string('REG_CODE', 10)->primary();
            $table->string('REG_LIBELLE');
            $table->string('REG_SIGLE', 10);
            $table->string('REG_SIGLE_CODE', 3)->unique();
            $table->date('REG_DATE_CREER');
            $table->string('REG_CREER_PAR');
            $table->date('REG_DATE_MODIFIER')->nullable();
            $table->string('REG_MODIFIER_PAR')->nullable();
            $table->integer('REG_VERSION')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('T_REGIES');
    }
};
