<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dhikrs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->bigInteger('total_count')->default(0);
            $table->integer('daily_count')->default(0);
            $table->integer('daily_limit')->nullable();
            $table->date('last_reset_date');
            $table->timestamps();
            $table->index(['user_id', 'last_reset_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dhikrs');
    }
};
