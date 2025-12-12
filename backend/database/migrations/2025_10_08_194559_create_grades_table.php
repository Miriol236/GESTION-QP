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
        Schema::create('t_grades', function (Blueprint $table) {
            $table->string('GRD_CODE', 10)->primary();
            $table->string('GRD_LIBELLE');
            $table->date('GRD_DATE_CREER');
            $table->string('GRD_CREER_PAR');
            $table->date('GRD_DATE_MODIFIER')->nullable();
            $table->string('GRD_MODIFIER_PAR')->nullable();
            $table->integer('GRD_VERSION')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_grades');
    }
};
