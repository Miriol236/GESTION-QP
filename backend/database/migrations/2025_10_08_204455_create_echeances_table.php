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
        Schema::create('T_ECHEANCES', function (Blueprint $table) {
            $table->string('ECH_CODE', 10)->primary();
            $table->string('ECH_LIBELLE');
            $table->date('ECH_DATE_CREER');
            $table->string('ECH_CREER_PAR');
            $table->date('ECH_DATE_MODIFIER')->nullable();
            $table->string('ECH_MODIFIER_PAR')->nullable();
            $table->integer('ECH_VERSION')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('T_ECHEANCES');
    }
};
