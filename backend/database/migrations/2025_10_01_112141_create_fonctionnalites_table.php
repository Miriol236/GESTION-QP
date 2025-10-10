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
        Schema::create('T_FONCTIONNALITES', function (Blueprint $table) {
            $table->string('FON_CODE', 10)->primary();
            $table->string('FON_NOM');
            $table->date('FON_DATE_CREER');
            $table->string('FON_CREER_PAR');
            $table->date('FON_DATE_MODIFIER')->nullable();
            $table->string('FON_MODIFIER_PAR')->nullable();
            $table->integer('FON_VERSION')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('T_FONCTIONNALITES');
    }
};
