using System;
using Npgsql;

namespace SqlFix
{
    class Program
    {
        static void Main(string[] args)
        {
            var csb = new NpgsqlConnectionStringBuilder("Host=aws-1-eu-west-1.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.qhnqgsdprnedynbradxx;Password=11223344556677889900mm;CommandTimeout=120;");
            csb.CommandTimeout = 120;
            try
            {
                using var conn = new NpgsqlConnection(csb.ConnectionString);
                conn.Open();
                Console.WriteLine("Connected to Postgres successfully.");

                Console.WriteLine("Executing seed script...");
                var sql = System.IO.File.ReadAllText(@"seed.sql");
                using var scriptCmd = conn.CreateCommand();
                scriptCmd.CommandText = sql;
                scriptCmd.ExecuteNonQuery();
                Console.WriteLine("Seed applied successfully.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
            }
        }
    }
}

