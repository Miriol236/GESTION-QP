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
        Schema::table('T_UTILISATEURS', function (Blueprint $table) {
            $table->string('REG_CODE', 10)->nullable()->after('GRP_CODE');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('T_UTILISATEURS', function (Blueprint $table) {
            $table->dropColumn('REG_CODE');
        });
    }
};
