ia-- 	Copyright (c) 2025 - 2025 Alan Chandler
--  This file is part of AKCMoney.

--    AKCMoney is free software: you can redistribute it and/or modify
--    it under the terms of the GNU General Public License as published by
--    the Free Software Foundation, either version 3 of the License, or
--    (at your option) any later version.

--    AKCMoney is distributed in the hope that it will be useful,
--    but WITHOUT ANY WARRANTY; without even the implied warranty of
--    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
--    GNU General Public License for more details.

--    You should have received a copy of the GNU General Public License
--    along with AKCMoney (file COPYING.txt).  If not, see <http://www.gnu.org/licenses/>.

INSERT INTO settings (name,value) VALUES 
('server_debug',''), -- this should be a colon separated list of server debug topics to actually log
('debug_cache',50); --size of server side debug cache

UPDATE codetype SET Description = 'Capital Asset' WHERE type = 'A';

ALTER TABLE Code ADD depreciateyear Integer;

INSERT INTO Code(type, description, depreciateyear) VALUES('A', 'Motor Vehicles', 5);

UPDATE code SET depreciateyear = 3 WHERE id = 12;

UPDATE Settings SET value = 2 WHERE name = 'version';

