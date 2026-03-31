INSERT INTO roles (name) VALUES ('employee'), ('manager'), ('admin');

INSERT INTO employees (id, name, department, position, joined, total_holidays, used_holidays, password, role)
VALUES 
('ADMIN', 'Admin User', 'IT', 'Administrator', '2020-01-01T00:00:00Z', 30, 0, 'admin', 'admin'),
('EMP001', 'Sara Ahmed', 'Sales', 'Sales Rep', '2022-06-15T00:00:00Z', 20, 2, '1234', 'employee'),
('EMP002', 'Omar Hassan', 'HR', 'HR Specialist', '2021-03-10T00:00:00Z', 25, 5, '1234', 'employee'),
('MGR001', 'Manager Example', 'Operations', 'Team Manager', '2020-05-01T00:00:00Z', 30, 3, '1234', 'manager');
