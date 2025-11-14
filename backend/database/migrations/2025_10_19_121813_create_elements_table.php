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
        Schema::create('T_ELEMENTS', function (Blueprint $table) {
            $table->string('ELT_CODE', 10)->primary();
            $table->string('ELT_LIBELLE');
            $table->integer('ELT_SENS', 1);
            $table->date('ELT_DATE_CREER')->nullable();
            $table->string('ELT_CREER_PAR')->nullable();
            $table->date('ELT_DATE_MODIFIER')->nullable();
            $table->string('ELT_MODIFIER_PAR')->nullable();
            $table->integer('ELT_VERSION')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('T_ELEMENTS');
    }
};
