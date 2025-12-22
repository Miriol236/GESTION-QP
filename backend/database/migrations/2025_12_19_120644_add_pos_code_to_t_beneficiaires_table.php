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
        Schema::table('t_beneficiaires', function (Blueprint $table) {
            $table->string('POS_CODE', 10)->nullable()->after('GRD_CODE');
            $table->foreign('POS_CODE')->references('POS_CODE')->on('t_positions');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('t_beneficiaires', function (Blueprint $table) {
            $table->dropColumn('POS_CODE');
        });
    }
};
