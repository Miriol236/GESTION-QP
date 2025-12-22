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
         Schema::table('t_domiciliers', function (Blueprint $table) {
            $table->string('DOM_FICHIER')->nullable()->after('DOM_RIB');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('t_domiciliers', function (Blueprint $table) {
            $table->dropColumn('DOM_FICHIER');
        });
    }
};
