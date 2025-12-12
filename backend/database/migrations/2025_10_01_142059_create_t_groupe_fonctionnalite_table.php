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
        Schema::create('t_groupe_fonctionnalite', function (Blueprint $table) {
            $table->string('GRP_CODE');
            $table->string('FON_CODE');

            $table->foreign('GRP_CODE')->references('GRP_CODE')->on('T_GROUPES');
            $table->foreign('FON_CODE')->references('FON_CODE')->on('T_FONCTIONNALITES');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_groupe_fonctionnalite');
    }
};
