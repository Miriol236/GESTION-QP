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
        Schema::create('t_details_paiement', function (Blueprint $table) {
            $table->string('DET_CODE', 12)->primary();
            $table->string('PAI_MONTANT')->nullable();
            $table->string('ELT_CODE', 10)->nullable();
            $table->string('PAI_CODE', 10)->nullable();
            $table->foreign('ELT_CODE')->references('ELT_CODE')->on('t_elements');
            $table->foreign('PAI_CODE')->references('PAI_CODE')->on('t_paiements');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_details_paiement');
    }
};
