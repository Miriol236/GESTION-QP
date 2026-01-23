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
        Schema::create('t_mouvements', function (Blueprint $table) {
            $table->string('MVT_CODE', 15)->primary();
            $table->string('MVT_BEN_CODE', 12)->nullable();
            $table->string('MVT_DOM_CODE', 8)->nullable();
            $table->string('MVT_PAI_CODE', 12)->nullable();
            $table->date('MVT_DATE');
            $table->integer('MVT_NIV');
            $table->string('MVT_UTI_CODE', 4);
            $table->string('MVT_CREER_PAR');
            $table->string('MVT_UTI_REG', 3);
            $table->string('TYP_CODE', 8);
            $table->foreign('TYP_CODE')->references('TYP_CODE')->on('t_type_mouvements');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_mouvements');
    }
};