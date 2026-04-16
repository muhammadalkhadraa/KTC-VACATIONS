using System;

namespace KtcBackend
{
    public static class HolidayCalculator
    {
        public static double CalculateAccruedHolidays(Employee emp, DateTime referenceDate, PrsMst? prs = null)
        {
            if (emp == null) return 0;

            // Prioritize PRS_MST data, fallback to portal manual entries
            var dobVal = prs?.BirthDate ?? emp.DateOfBirth;
            if (!dobVal.HasValue) return 0;
            DateTime dob = dobVal.Value;

            DateTime hireDate = prs?.StartDate ?? emp.Joined;
            DateTime insDate = prs?.InsuranceDate ?? (emp.InsuranceStartDate ?? hireDate);

            double totalAccrued = 0;

            // 1. Calculate months of service
            int monthsService = MonthsBetween(hireDate, referenceDate);

            if (monthsService < 6) return 0;

            // 2. The 6-month one-time grant
            int ageAt6Months = CalculateAge(dob, hireDate.AddMonths(6));
            if (ageAt6Months >= 50)
                totalAccrued += 15;
            else
                totalAccrued += 7.5;

            // 3. Accrual for month 7 to current month
            // We include the current month to match "live" balance expectations
            int monthsSpent = MonthsBetween(hireDate, referenceDate);
            int monthsInFirstYear = Math.Min(monthsSpent + 1, 12);
            for (int m = 7; m <= monthsInFirstYear; m++)
            {
                DateTime checkDate = hireDate.AddMonths(m - 1); // accrual for that month
                int age = CalculateAge(dob, checkDate);
                int insYears = MonthsBetween(insDate, checkDate) / 12;

                if (age >= 50 || insYears >= 10)
                    totalAccrued += 2.5;
                else
                    totalAccrued += 1.25;
            }

            // 4. Accrual after first year
            if (monthsSpent + 1 > 12)
            {
                for (int m = 13; m <= monthsSpent + 1; m++)
                {
                    DateTime checkDate = hireDate.AddMonths(m - 1);
                    int age = CalculateAge(dob, checkDate);
                    int insYears = MonthsBetween(insDate, checkDate) / 12;
                    int serviceYears = MonthsBetween(hireDate, checkDate) / 12;

                    // Special rule: After 10 years of service -> 2.5
                    if (serviceYears >= 10)
                    {
                        totalAccrued += 2.5;
                    }
                    else if (age >= 50 || insYears >= 10)
                    {
                        totalAccrued += 2.5;
                    }
                    else
                    {
                        totalAccrued += 1.75;
                    }
                }
            }

            return Math.Round(totalAccrued, 2);
        }

        private static int MonthsBetween(DateTime start, DateTime end)
        {
            if (end < start) return 0;
            return ((end.Year - start.Year) * 12) + end.Month - start.Month;
        }

        private static int CalculateAge(DateTime dob, DateTime dateAt)
        {
            int age = dateAt.Year - dob.Year;
            if (dateAt < dob.AddYears(age)) age--;
            return age;
        }
    }
}
