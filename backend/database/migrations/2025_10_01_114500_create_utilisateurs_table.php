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
        Schema::create('t_utilisateurs', function (Blueprint $table) {
            $table->string('UTI_CODE', 10)->primary();
            $table->string('UTI_NOM');
            $table->string('UTI_PRENOM');
            $table->string('UTI_SEXE', 1);
            $table->string('UTI_USERNAME');
            $table->string('UTI_PASSWORD');
            $table->string('UTI_AVATAR');
            $table->date('UTI_DATE_CREER');
            $table->string('UTI_CREER_PAR');
            $table->date('UTI_DATE_MODIFIER')->nullable();
            $table->string('UTI_MODIFIER_PAR')->nullable();
            $table->integer('UTI_VERSION')->nullable();
            $table->boolean('UTI_STATUT');
            $table->string('GRP_CODE', 10);
            $table->foreign('GRP_CODE')->references('GRP_CODE')->on('T_GROUPES');
            $table->string('GOOGLE_ID')->nullable()->unique();
            $table->string('FACEBOOK_ID')->nullable()->unique();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_utilisateurs');
    }
};
