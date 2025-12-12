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
        Schema::create('t_groupes', function (Blueprint $table) {
            $table->string('GRP_CODE', 10)->primary();
            $table->string('GRP_NOM');
            $table->date('GRP_DATE_CREER');
            $table->string('GRP_CREER_PAR');
            $table->date('GRP_DATE_MODIFIER')->nullable();
            $table->string('GRP_MODIFIER_PAR')->nullable();
            $table->integer('GRP_VERSION')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_groupes');
    }
};
