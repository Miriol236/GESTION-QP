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
        Schema::create('t_banques', function (Blueprint $table) {
            $table->string('BNQ_CODE', 10)->primary();
            $table->string('BNQ_LIBELLE');
            $table->date('BNQ_DATE_CREER');
            $table->string('BNQ_CREER_PAR');
            $table->date('BNQ_DATE_MODIFIER')->nullable();
            $table->string('BNQ_MODIFIER_PAR')->nullable();
            $table->integer('BNQ_VERSION')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_banques');
    }
};
