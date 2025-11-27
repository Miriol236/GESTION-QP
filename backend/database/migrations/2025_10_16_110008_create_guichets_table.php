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
        Schema::create('T_GUICHETS', function (Blueprint $table) {
            $table->string('GUI_ID', 10)->primary();
            $table->string('GUI_NOM')->nullable();
            $table->string('GUI_CODE', 10);
            $table->date('GUI_DATE_CREER');
            $table->string('GUI_CREER_PAR');
            $table->date('GUI_DATE_MODIFIER')->nullable();
            $table->string('GUI_MODIFIER_PAR')->nullable();
            $table->integer('GUI_VERSION')->nullable();
            $table->string('BNQ_CODE', 10);
            $table->foreign('BNQ_CODE')->references('BNQ_CODE')->on('T_BANQUES');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('T_GUICHETS');
    }
};
