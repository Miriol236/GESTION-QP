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
        Schema::table('t_groupes', function (Blueprint $table) {
            $table->string('NIV_CODE', 10)->nullable();
            $table->foreign('NIV_CODE')->references('NIV_CODE')->on('t_niveau_validations');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('t_groupes', function (Blueprint $table) {
            $table->dropColumn('NIV_CODE');
        });
    }
};
